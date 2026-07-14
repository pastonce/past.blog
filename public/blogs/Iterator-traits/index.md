> * `trait`意为特征、特点，在 STL 中一般希望能借助各种`traits`获取到各对象（如`type`,`iterator`,`char`,`allocator`,`pointer`,`array`等）的重要特征以完成所需操作
> * `Iterator Traits`用以分离`class iterators`和`non-class iterators`（即朴素指针）

## Iterator需要提供的相关类型

对于`Iterator`来说，一般需要提取的**相关类型**（associated types）包括以下五种：

* `iterator_category`：此处指`iterator`的移动性质的类别，区分移动方向及移动步长等
* `difference_type`：此处指两个`iteraotr`之间的距离应该用什么类型来表示，如`unsigned int`（4字节）表示最大距离不超过$2^{32}$
* `value_type`：此处指`iterator`所指向的元素的类型
* `reference`：引用，未被使用
* `pointer`：指针，未被使用

这些特征需要在`Iterator`的类中定义出来以供`Algorithm`等调用，**通常以`typedef`的形式呈现**

## Iterator Traits

但**`Iterator`是泛化的指针，指针是退化的`Iterator`**，其他部件并不能区分两者，而且朴素指针不以类的形式定义，无法提供上述五种相关类型，`Iterator Traits`即为解决该问题的中间层

```c++
template <typename I>
struct iterator_traits {
    typedef typename I::iterator_category iterator_category;
    typedef typename I::value_type value_type;
    typedef typename I::difference_type difference_type;
    typedef typename I::pointer pointer;
    typedef typename I::reference reference;
};
template <typename T>
struct iterator_traits<T*> {
    typedef random_access_iterator_tag iterator_category;
    typedef T value_type;
    typedef ptrdiff_t difference_type;
    typedef T* pointer;
    typedef T& reference;
};
template <typename T>
struct iterator_traits<const T*> {
    typedef random_access_iterator_tag iterator_category;
    typedef T value_type; // 注意此处并非const
    typedef ptrdiff_t difference_type;
    typedef const T* pointer;
    typedef const T& reference;
};
```

* 可以看到，`iterator_traits`以**部分特化**（详见[[STL 1] | C++ STL体系结构基础](https://past-blog.vercel.app/blog/Standard-Template-Library)）的方式分离出了指针`line 9-24`
* 对`class iterators`直接调用其相关类型，对`non-class iterators`则代替指针描述其特征
* `line 20`没有使用`const`是因为，**获取`value_type`的目的多用于声明新变量**，这要求变量是可以被赋值的
* 加入中间层之后其他部件调用示例如下：

```c++
template <typename I, ...>
void algorithm(...) {
    typename iterator_traits<I>::value_type v1;
}
```

这样无论传入的是`iterator`还是朴素指针，程序都可以正确响应了