## Array-TR1

`Array`即为静态数组，与其他容器最大的区别是无法成长，因此**`Array`的第二个模板参数不再是`allocator`而是数组大小**

```c++
// TR1(Technical Report 1版本)
template <typename _Tp, std::size_t _Nm>
struct array {
    typedef _Tp value_type;
    typedef _Tp* pointer;
    typedef value_type* iterator;
    
    value_type _M_instance[_Nm? _Nm: 1];
    
    iterator begin() {
        return iterator(&_M_instance[0]);
    }
    iterator end() {
        return iterator(&_M_instance[_Nm]);
    }
    ...
};
```

* 可以看到**`Array`的`iterator`是朴素指针**的形式，这与`vector`一致
* `Array`的底层实际上就是一个基础数据结构——数组，因此也**没有构造函数和析构函数**

## Array-GCC4.9

GCC4.9版本对`Array`的实现与`TR1`大同小异，关键部分的代码如下：

```c++
template<typename _Tp, std::size_t _Nm>
struct array {
    typedef _Tp value_type;
    typedef value_type* pointer;
    typedef value_type& reference;
    typedef value_type* iterator;
    typedef std::size_t size_type;
    ...
    typedef _GLIBCXX_STD_C::__array_traits<_Tp, _Nm> _AT_Type;
    typename _AT_Type::_Type                         _M_elems;
    ...
    iterator begin() noexcept
    { return iterator(data()); }
    iterator end() noexcept
    { return iterator(data() + _Nm); }
    size_type size() const noexcept { return _Nm; }
    bool empty() const noexcept { return size() == 0; }
    reference operator[](size_type __n) noexcept
      { return _AT_Type::_S_ref(_M_elems, __n); }
    reference at(size_type __n) {
        if (__n >= _Nm)
            std::__throw_out_of_range_fmt(__N("array::at: __n (which is %zu) "
                                              ">= _Nm (which is %zu)"),__n, _Nm);
        return _AT_Type::_S_ref(_M_elems, __n);
    }
    pointer data() noexcept
    { return _AT_Type::_S_ptr(_M_elems); }
};
```

* 其中，`line 10`中使用的`_Type`在`__array_traits`中定义为`typedef _Tp _Type[_Nm]`，也是一个基础数组
* `_S_ref`实际是一个静态常量引用，`_S_ptr`则是一个静态常量指针
* 对比`[]`运算符重载和`at`方法可知，**使用`[]`没有边界检查而使用`at`方法可以防止越界索引**

## Forward-List-GCC4.9

`Forward-List` 是一个单向链表，支持在容器中的任何位置快速插入和删除元素，但**不支持快速随机访问**；与`List`相比，**当不需要双向迭代时，此容器能提供更节省空间的存储**

![](/blogs/Container-array-forwardlist/894d4eb9e49ef6c9.png)

* `Forward-List`的主要元素是`_M_head`结构，实际上就是链表的头节点，一个指向链表第一个节点的指针，因此**至少占用的空间大小为 4 字节**（32-bit系统）

* ```c++
    iterator before_begin() noexcept
    { return iterator(&this->_M_impl._M_head); }
    iterator begin() noexcept
    { return iterator(this->_M_impl._M_head._M_next); }
    iterator end() noexcept
    { return iterator(nullptr); }
    ```

    如上述代码所示，`before_begin()`方法返回头节点（方便在链表头插入元素），`begin()`返回第一个节点，而**`end()`返回空指针的`iterator`**（即最后一个节点的下一个位置）

* `Forward-List`还提供`sort()`方法，使用**归并排序**，平均时间复杂度为`O(nlogn)`

