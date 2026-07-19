> * `Deque`是一个两端均可扩充的队列，为了实现该特性，`Deque`的元素是不连续存储的（**分段连续**）
> * **与`Vector`相比，`Deque`的扩展要更加便宜**

![](/blogs/Container-deque/22ecb6779d7284e9.png)

* 做法类似数据库系统中的**二级索引**，`map`是通过`Vector`实现的，其中的每个位置都存储着**指向`buffer`的指针**；因为`map`是一个`Vector`，它也可以在空间不足时进行倍数成长，区别在于：
    * 成长后仅需移动`map`中的指针即可，**实际存储元素的位置无需改变**
    * 成长后整个`map`会移动到新空间的**中间位置**，这是为了确保两侧都有可扩展的空间，尽可能减少成长次数
* `Deque`的`iterator`需要存取四个指针，分别为当前元素`cur`，当前索引节点`node`，当前`buffer`的边界`first`和`last`
* 通过与`first`和`last`是否相等的判断，以及对当前索引节点`node`的控制，可以实现伪连续且可双向扩展的特性

## Deque-GCC2.9

### 基础结构

GCC2.9版本允许使用者指定每个`buffer`的大小（模板参数`BufSiz`）

```c++
template <typename T, typename Alloc = alloc, size_t BufSiz = 0>
class deque {
public:
    typedef T value_type;
    typedef __deque_iterator<T, T&, T*, BufSiz> iterator;
    ...
protected:
    typedef pointer* map_pointer;
    ...
protected:
    iterator start;
    iterator finish;
    map_pointer map;
    size_type map_size;
public:
    itarator begin() { return start; }
    iterator end() { return finish; }
    ...
};
// --------------------------------------------------------------
template <typename T, typename Ref, typename Ptr, size_t BufSiz>
struct __deque_iterator {
    typedef random_access_iterator_tag iterator_category;
    typedef T value_type;
    typedef Ptr pointer;
    typedef Ref reference;
    typedef size_t size_type;
    typedef ptrdiff_t difference_type;
    typedef T** map_pointer; // 指向 map 节点的指针
    typedef __deque_iterator self;
    
    T* cur;
    T* first;
    T* last;
    map_pointer node;
    ...
};
```

* 可以看到，`Deque`的主要元素是`start`/`finish`/`map`/`map_size`，而每个`iterator`的主要元素是 4 个指针，因此`Deque`**至少占用的空间大小为 $4\times 4\times 2 + 4 + 4 = 40$ 字节**（32-bit系统）

* `iterator`内照常提供了五个`traits`所需的定义，**注意`iterator_category`与`Vector`一致**（详见[[STL 4] | Container-2-动态数组Vector](https://past-blog.vercel.app/blog/Container-vector)），这是因为`Deque`通过控制`iterator`实现了伪连续存储与随机访问

* 对于`BufSiz`为 0 的默认值，GCC2.9是这样处理的：

    ```c++
    inline size_t __deque_buf_size(size_t n, size_t sz) {
        return n != 0? n: (sz < 512? size_t(512 / sz): size_t(1));
    }
    ```

    即`n != 0`时使用用户自定义值，**`n = 0`时使用默认值**；如果存储元素大小小于`512`，就**维持`buffer`大小为`512`**来计算元素个数，否则每个`buffer`中元素个数为 1

`Deque`有一个`insert`方法值得一提，它会**根据插入位置相对首尾的距离大小选择代价最小的元素移动方式**：

```c++
iterator insert(iterator position, const value_type& x) {
    if (position == start.cur) { // 插入在开头，调用 push_front
        push_front(x);
        return start;
    } else if (position == finish.cur) { // 插入在结尾，调用 push_back
        push_back(x);
        iterator tmp = finish;
        --tmp; // 计算实际插入位置
        return tmp;
    } else {
        return insert_aux(position, x);
    }
}
// ------------------------------------------------------
deque<T, Alloc, BufSiz>::insert_aux(iterator pos, const value_type& x) {
    difference_type index = pos - start;
    value_type x_copy = x;
    if (index < size() / 2) { // 插入位置距离首节点较近
        push_front(front());
        ...
        copy(front2, pos1, front1);
    } else { // 插入位置距离尾节点较近
        push_back(back());
        ...
        copy_backward(pos, back2, back1);
    }
    *pos = x_copy;
    return pos;
}
```

* `line 19-21`和`line 23-25`执行逻辑一致，先拷贝首尾元素，再设置新的首尾`front1/back1`，原首尾为`front2/back2`，对插入位置和首尾之间的元素移动一个位置

### 如何实现伪连续存储

`Deque`主要通过对`iterator`的控制来实现物理不连续存储与实际使用体验的桥接

```c++
// class deque
reference operator[] (size_type n) {
    return start[difference_type(n)]; // 距离 start 第 n 个位置的元素，见下文
}
reference front() { return *start; }
reference back() { // 返回 finish 指向位置的上一个位置的元素
    iterator tmp = finish;
    --tmp;
    return tmp;
}
size_type size() const { return finish - start; }
bool empty() const { return finish == start; }
// struct __deque_iterator
reference operator*() const { return *cur; }
pointer operator->() const { return &(operator*()); }
difference_type operator-(const self& x) const {
    return difference_type(buffer_size()) * (node - x.node - 1) +
        (cur - first) + (x.last - x.cur);
}

self& operator++() { // 前置++，返回引用
    ++cur;
    if (cur == last) { // 抵达当前 buffer 的末尾
        set_node(node + 1);
        cur = first;
    }
    return *this;
}
self operator++(int) {
    self tmp = *this; // 触发拷贝构造函数，深拷贝
    ++*this; // 此处调用重载的前置++
    return tmp; // 返回原值
}
void set_node(map_pointer new_node) {
    node = new_node;
    first = *new_node;
    last = first + difference_type(buffer_size());
}
```

* `size()`方法中直接返回了两个`iterator`的差值，因为在`iterator`内**对`-`运算符进行了重载**，先计算索引节点的差值乘以单个索引节点的元素个数，再加上两端`buffer`内的元素个数

* `line 36`中由于`new_node`实际上是二级指针，因此`first`即为`new_node`所指向的内容：一个指向新`buffer`的首地址的指针

* 类似的`--`运算符重载实现如下：

    ```c++
    self& operator--() { // 前置--，返回引用
        if (cur == first) { // 抵达当前 buffer 的起始
            set_node(node - 1);
            cur = last;
        }
        --cur;
        return *this;
    }
    self operator--(int) {
        self tmp = *this; // 触发拷贝构造函数，深拷贝
        --*this; // 此处调用重载的前置--
        return tmp; // 返回原值
    }
    ```

    这里的`line 2-5`和之前的`line 23-26`共同保证了使用该容器进行加减 1 操作时的伪连续存储特征

---

对于加减`n`操作的伪连续存储特征，同样需要对`+=`/`-=`/`+(int)`/`-(int)`这些运算符进行重载

```c++
self& operator+=(difference_type n) {
    difference_type offset = n + (cur - first); // 计算对于当前 buffer 起始位置的偏移量
    if (offset >= 0 && offset < difference_type(buffer_size()))
        cur += n;
    else {
        difference_type node_offset = offset > 0? offset / difference_type(buffer_size()):
        -difference_type((-offset - 1) / buffer_size()) - 1;
        set_node(node + node_offset);
        cur = first + (offset - node_offset * difference_type(buffer_size()));
    }
    return *this;
}
self operator+(difference_type n) const {
    self tmp = *this;
    return tmp += n; // 复用 += 重载方法
}
```

* `line 3-4`处理目标位置仍在当前`buffer`内的情况，仅移动`cur`指针即可

* `line 5-10`处理目标位置不在当前`buffer`内的情况（**包括`+=`负数**），先计算`map`节点所需的偏移量，然后通过`set_node`更新`node`/`first`/`last`，最后重新计算`cur`的位置

* 注意**`+`重载返回的是深拷贝结果而非引用**，因此先通过`line 14`进行了拷贝构造

* 有了以上实现，就可以快速实现下述方法：

    ```c++
    self& operator-=(difference_type n) {
        return *this += -n;
    }
    self operator-(difference_type n) const {
        self tmp = *this;
        return tmp -= n;
    }
    reference operator[](difference_type n) const {
        return *(*this + n);
    }
    ```

    对`[]`的重载先调用了`operator+`方法返回了一个拷贝构造后移动了`n`单位的`iterator`，然后调用了`operator*`方法（见上文）返回了`iterator`的`cur`指针的解引用，即实际存储的目标元素

## Deque-GCC4.9

GCC4.9版本不再允许使用者指定每个`buffer`的大小，而是使用和GCC2.9相同的默认配置：**单元素大小不超过 512 字节则固定`buffer`为 512 字节，否则每个`buffer`只含有一个元素**，其实现结构如下图：

![](/blogs/Container-deque/ab923b0edad846a9.png)

* GCC4.9中`Deque`的主要元素依然是首尾`iterator`、`map`大小以及指向`map`的指针，因此至少占用的空间大小同样是 40 字节（32-bit系统）