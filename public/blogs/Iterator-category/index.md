## Iterator的分类

`iterator`根据其移动性质`iterator_category`可以分为五大类，它们之间的继承关系如图所示：

![](/blogs/Iterator-category/18e0e39b972185c7.png)

STL 中常见的各容器及其对应的`iterator_categpry`如下表所示：

|                        容器                        |     `iterator_category`      |
| :------------------------------------------------: | :--------------------------: |
|                      `array`                       | `random_access_iterator_tag` |
|                      `vector`                      | `random_access_iterator_tag` |
|                   `forward_list`                   |    `forward_iterator_tag`    |
|                       `list`                       | `bidirectional_iterator_tag` |
|                      `deque`                       | `random_access_iterator_tag` |
|                   `queue/stack`                    |              无              |
|                     `rb_tree`                      | `bidirectional_iterator_tag` |
|           `set/multiset`，`map/multimap`           | `bidirectional_iterator_tag` |
|                    `hashtable`                     | 一般为`forward_iterator_tag` |
| `unordered_set/multiset`，`unordered_map/multimap` | 一般为`forward_iterator_tag` |

* `queue`和`stack`有自己的存取规则，**不提供相应的`iterator`**
* `hashtable`的迭代器移动性质要**取决于每个`bucket`中的链表**是单向的还是双向的
* 除此之外，标准库还提供两个特殊的迭代器：`istream_iterator`以及`ostream_iterator`，分别属于`input_iterator_tag`和`output_iterator_tag`

## Iterator分类对算法Algorithm的意义

通过`iterator_category`对各个`iterator`进行分类之后，可以**方便算法根据迭代器特性实现不同的版本**，从而获得更高的效率。以 GCC2.9 内置的`distance`和`advance`算法为例：

```c++
template <class InputIterator>
inline iterator_traits<InputIterator>::difference_type
distance(InputIterator first, InputIterator last) { // 主体
    typedef typename iterator_traits<InputIterator>::iterator_category category;
    return __distance(first, last, category()); // “选择器”
}
template <class InputIterator>
inline iterator_traits<InputIterator>::difference_type
__distance(InputIterator first, InputIterator last, input_iterator_tag) { // 内部函数 版本1
    iterator_traits<InputIterator>::difference_type n = 0;
    while (first != last) {
        ++first; ++n;
    }
    return n;
}
template <class RandomAccessIterator>
inline iterator_traits<RandomAccessIterator>::difference_type
__distance(RandomAccessIterator first, RandomAccessIterator last, // 内部函数 版本2
           random_access_iterator_tag) {
    return last - first;
}
```

* `distance`算法的作用是计算给定的两个`iterator`之间的距离
* `line 2`通过`iterator_traits`取得对应的`difference_type`作为返回类型，`line 4`则取得对应的`iterator_category`，并在`line 5`构建一个对象作为参数传入内部函数
* 根据函数重载的规则，**运行前编译器会根据`iterator`的类型自动选择调用对应的内部函数**
* 对于`random_access_iterator_tag`类型，调用`line 18`的版本，因该类的`iterator`移动是连续的，因此直接相减计算距离
* 对于不属于`random_access_iterator_tag`但属于`input_iterator_tag`的类型，调用`line 9`的版本，只能通过逐次移动来确定距离

得益于各个`iterator_category`之间的继承关系（而非并列关系），可以更好地结合函数重载的特性设计“选择器”，使代码更简洁易读，**算法在各种情况下都能尽可能地提高效率**

---

```c++
template <class InputIterator, class Distance>
inline void advance(InputIterator& i, Distance n) { // 主体
    __advance(i, n, iterator_category(i)); // “选择器”
}
template <class InputIterator, class Distance>
inline void __advance(InputIterator& i, Distance n, input_iterator_tag) { // 内部函数 版本1
    while (n--) ++i;
}
template <class BidirectionalIterator, class Distance>
inline void __advance(BidirectionalIterator& i, Distance n, // 内部函数 版本2
                      bidirectional_iterator_tag) {
    if (n >= 0)
        while (n--) ++i;
    else
        while (n++) --i;
}
template <class RandomAccessIterator, class Distance>
inline void __advance(RandomAccessIterator& i, Distance n, // 内部函数 版本3
                      random_access_iterator_tag) {
    i += n;
}
```

* `advance`算法的作用是使给定的`iterator`前进`n`个单位（可以为负）
* `line 3`的`iterator_category(i)`作用与前述的取得相应`iterator_category`并构造对象相同
* 随机访问的`iterator`可以直接加上`n`个单位，（不是随机访问时）双向移动的`iterator`则根据`n`的正负进行逐步移动，剩下类型的`iterator`则只能向前逐步移动

值得一提的是，**算法无法从代码上实现只能接受某一种类型的`iterator`**，因此对于正确的类型传入只局限在“暗示”层面：用模板参数名称暗示应传入算法的正确`iterator`类型（如上述代码块的`line 1/5/9/17`）；因此，错误类型的`iterator`传入**只会在运行时报错**